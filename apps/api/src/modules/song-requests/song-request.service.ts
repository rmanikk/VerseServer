
import {
  SongRequestStatus,
  SongStatus,
  Prisma,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

interface CreateSongRequestInput {
  requesterUserId: string;
  artistName: string;
  songName: string;
  youtubeUrl: string;
  message?: string;
}

export async function createSongRequest(input: CreateSongRequestInput) {
  return prisma.songRequest.create({
    data: {
      requesterUserId: input.requesterUserId,
      requestedArtist: input.artistName,
      requestedTitle: input.songName,
      youtubeUrl: input.youtubeUrl,
      message: input.message || null,
      status: SongRequestStatus.PENDING,
    },
    select: {
      id: true,
      requestedArtist: true,
      requestedTitle: true,
      youtubeUrl: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });
}

interface ListSongRequestsInput {
  status?: SongRequestStatus;
  page: number;
  limit: number;
}

export async function getSongRequests(input: ListSongRequestsInput) {
  const { status, page, limit } = input;

  const where: Prisma.SongRequestWhereInput = status ? { status } : {};

  const [requests, total] = await prisma.$transaction([
    prisma.songRequest.findMany({
      where,
      include: {
        reviewedByAdmin: {
          select: { id: true, name: true, email: true },
        },
        fulfilledSong: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.songRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSongRequestById(id: string) {
  return prisma.songRequest.findUnique({
    where: { id },
    include: {
      reviewedByAdmin: {
        select: { id: true, name: true, email: true },
      },
      fulfilledSong: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  });
}

export async function getUserSongRequests(
  requesterUserId: string,
  page: number,
  limit: number
) {
  const where: Prisma.SongRequestWhereInput = { requesterUserId };

  const [requests, total] = await prisma.$transaction([
    prisma.songRequest.findMany({
      where,
      select: {
        id: true,
        requestedTitle: true,
        requestedArtist: true,
        youtubeUrl: true,
        message: true,
        status: true,

        // Only the user-visible response is returned.
        // adminNotes is deliberately excluded.
        responseMessage: true,

        createdAt: true,
        updatedAt: true,
        fulfilledSong: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.songRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

interface ReviewSongRequestInput {
  requestId: string;
  adminId: string;
  action: "ACCEPTED" | "REJECTED";
  adminNotes?: string;
  responseMessage?: string;
}

export async function reviewSongRequest(input: ReviewSongRequestInput) {
  const result = await prisma.songRequest.updateMany({
    where: {
      id: input.requestId,
      status: SongRequestStatus.PENDING,
    },
    data: {
      status:
        input.action === "ACCEPTED"
          ? SongRequestStatus.ACCEPTED
          : SongRequestStatus.REJECTED,

      adminNotes: input.adminNotes || null,
      responseMessage: input.responseMessage || null,

      reviewedByAdminId: input.adminId,
      reviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getSongRequestById(input.requestId);
}

interface FulfillSongRequestInput {
  requestId: string;
  adminId: string;
  songId: string;
}

export async function fulfillSongRequest(input: FulfillSongRequestInput) {
  return prisma.$transaction(async (tx) => {
    const songRequest = await tx.songRequest.findUnique({
      where: { id: input.requestId },
    });

    if (
      !songRequest ||
      songRequest.status !== SongRequestStatus.ACCEPTED
    ) {
      return null;
    }

    const song = await tx.song.findFirst({
      where: {
        id: input.songId,
        status: SongStatus.APPROVED,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
      },
    });

    if (!song) {
      throw new Error(
        "The linked song must be approved and published."
      );
    }

    const result = await tx.songRequest.updateMany({
      where: {
        id: input.requestId,
        status: SongRequestStatus.ACCEPTED,
      },
      data: {
        status: SongRequestStatus.FULFILLED,
        fulfilledSongId: song.id,
        reviewedByAdminId: input.adminId,
        reviewedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return tx.songRequest.findUnique({
      where: { id: input.requestId },
      include: {
        fulfilledSong: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishedAt: true,
          },
        },
      },
    });
  });
}
