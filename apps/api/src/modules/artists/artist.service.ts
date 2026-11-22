
import { prisma } from "../../lib/prisma.js";

export async function getArtists() {
  return prisma.artist.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      avatarImageKey: true,
      coverImageKey: true,
      genres: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      moods: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          songs: true,
          albums: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getArtistBySlug(slug: string) {
  return prisma.artist.findFirst({
    where: {
      slug,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      avatarImageKey: true,
      coverImageKey: true,
      genres: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      moods: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      songs: {
        where: {
          song: {
            status: "APPROVED",
          },
        },
        select: {
          role: true,
          song: {
            select: {
              id: true,
              title: true,
              slug: true,
              durationSeconds: true,
              coverImageKey: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      albums: {
        where: {
          album: {
            status: "PUBLISHED",
          },
        },
        select: {
          role: true,
          album: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageKey: true,
              releaseDate: true,
            },
          },
        },
      },
    },
  });
}
