import { PrismaClient } from "@prisma/client";

let prisma = new PrismaClient();

async function main() {
  // let password = "admin";
  // let hashedPassword = await bcrypt.hash(password, 10);

  // let metadata: { metadata_key: string }[] = await prisma.$queryRaw`
  //   WITH keys AS (
  //       SELECT
  //           jsonb_object_keys(request_headers) AS metadata_key
  //       FROM
  //           "Request"
  //   )
  //   SELECT
  //       metadata_key
  //   FROM
  //       keys
  //   WHERE
  //       metadata_key ILIKE 'x-metadata-%';

  // `;
  // console.log(JSON.stringify(metadata, null, 2));

  let requests = await prisma.request.findMany({
    where: {
      AND: [
        {
          request_headers: {
            path: ["x-metadata-tier"],
            string_contains: `free`,
          },
        },
      ],
    },
  });

  console.log(requests);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
