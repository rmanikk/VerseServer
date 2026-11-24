
import { prisma } from "../../lib/prisma.js";

const publicSongWhere = {
  status: "APPROVED" as const,
  publishedAt: {
    not: null,
  },
  audioAssets: {
    some: {
      status: "READY" as const,
    },
  },
};

const publicAlbumWhere = {
  status: "PUBLISHED" as const,
};

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
          songs: {
            where: {
              song: publicSongWhere,
            },
          },
          albums: {
            where: {
              album: publicAlbumWhere,
            },
          },
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
          song: publicSongWhere,
        },

        select: {
          role: true,
          position: true,

          song: {
            select: {
              id: true,
              title: true,
              slug: true,
              durationSeconds: true,
              coverImageKey: true,
              publishedAt: true,
            },
          },
        },

        orderBy: {
          position: "asc",
        },
      },

      albums: {
        where: {
          album: publicAlbumWhere,
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
