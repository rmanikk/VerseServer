
import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  createArtistApplicationSchema,
  reviewArtistApplicationSchema,
} from "./artist-application.schema.js";
import type { z } from "zod";

type CreateApplicationInput = z.infer<
  typeof createArtistApplicationSchema
>;

type ReviewApplicationInput = z.infer<
  typeof reviewArtistApplicationSchema
>;

function createSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artist"
  );
}

async function createUniqueArtistSlug(
  name: string,
  transaction: Prisma.TransactionClient,
): Promise<string> {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await transaction.artist.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function createArtistApplication(
  input: CreateApplicationInput,
) {
  const existingApplication =
    await prisma.artistApplication.findFirst({
      where: {
        applicantUserId: input.applicantUserId,
        status: "PENDING",
      },
      select: { id: true },
    });

  if (existingApplication) {
    throw new Error(
      "You already have a pending artist application.",
    );
  }

  const existingArtist = await prisma.artist.findFirst({
    where: { ownerUserId: input.applicantUserId },
    select: { id: true },
  });

  if (existingArtist) {
    throw new Error(
      "This user already has an artist profile.",
    );
  }

  return prisma.artistApplication.create({
    data: {
      applicantUserId: input.applicantUserId,
      proposedName: input.proposedName,
      bio: input.bio || null,
    },
  });
}

export async function getArtistApplications(
  status?: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN",
) {
  return prisma.artistApplication.findMany({
    where: status ? { status } : undefined,
    include: {
      reviewedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedArtist: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getArtistApplicationById(id: string) {
  return prisma.artistApplication.findUnique({
    where: { id },
    include: {
      reviewedByAdmin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedArtist: true,
    },
  });
}

export async function reviewArtistApplication(
  applicationId: string,
  adminId: string,
  input: ReviewApplicationInput,
) {
  return prisma.$transaction(
    async (transaction) => {
      const application =
        await transaction.artistApplication.findUnique({
          where: { id: applicationId },
        });

      if (!application) {
        throw new Error("Artist application not found.");
      }

      if (application.status !== "PENDING") {
        throw new Error(
          "This application has already been reviewed.",
        );
      }

      if (input.action === "REJECTED") {
        const result =
          await transaction.artistApplication.updateMany({
            where: {
              id: applicationId,
              status: "PENDING",
            },
            data: {
              status: "REJECTED",
              reviewNotes: input.reviewNotes || null,
              reviewedByAdminId: adminId,
              reviewedAt: new Date(),
            },
          });

        if (result.count !== 1) {
          throw new Error(
            "This application has already been reviewed.",
          );
        }

        return transaction.artistApplication.findUnique({
          where: { id: applicationId },
          include: {
            reviewedByAdmin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      }

      const existingArtist =
        await transaction.artist.findFirst({
          where: {
            ownerUserId: application.applicantUserId,
          },
          select: { id: true },
        });

      if (existingArtist) {
        throw new Error(
          "This user already has an artist profile.",
        );
      }

      const slug = await createUniqueArtistSlug(
        application.proposedName,
        transaction,
      );

      const artist = await transaction.artist.create({
        data: {
          name: application.proposedName,
          slug,
          bio: application.bio,
          ownerUserId: application.applicantUserId,
        },
      });

      const result =
        await transaction.artistApplication.updateMany({
          where: {
            id: applicationId,
            status: "PENDING",
          },
          data: {
            status: "APPROVED",
            reviewNotes: input.reviewNotes || null,
            reviewedByAdminId: adminId,
            reviewedAt: new Date(),
            approvedArtistId: artist.id,
          },
        });

      if (result.count !== 1) {
        throw new Error(
          "This application has already been reviewed.",
        );
      }

      return {
  ...application,
  status: "APPROVED" as const,
  reviewNotes: input.reviewNotes || null,
  reviewedByAdminId: adminId,
  reviewedAt: new Date(),
  approvedArtistId: artist.id,
  approvedArtist: artist,
};
    },
    {
  maxWait: 15_000,
  timeout: 60_000,
},
  );
}
