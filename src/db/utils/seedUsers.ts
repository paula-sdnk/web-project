import db from "../config";
import { faker } from "@faker-js/faker";
import { createUser } from "../handlers/users";

const NUM_USERS_TO_SEED = 120;

async function seedUsersTable() {
  let seededCount = 0;
  let failedToCreateCount = 0;

  try {
    db.exec("BEGIN TRANSACTION;");

    for (let i = 0; i < NUM_USERS_TO_SEED; i++) {
      const username =
        faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9_.]/g, "_") + `_${faker.string.alphanumeric(4)}`;
      const email = `${faker.string.alphanumeric(6)}_${faker.internet
        .email()
        .toLowerCase()}`;
      const password = faker.internet.password();

      try {
        await Promise.resolve(createUser(username, email, password));
        seededCount++;
        if (seededCount % 10 === 0 || seededCount === NUM_USERS_TO_SEED) {
          console.log(`Seeded ${seededCount}/${NUM_USERS_TO_SEED} users...`);
        }
      } catch (error: any) {
        if (
          error.message &&
          error.message.includes("UNIQUE constraint failed")
        ) {
          failedToCreateCount++;
        } else {
          console.error(
            `Error creating user ${username} (will attempt to rollback):`,
            error
          );
          throw error;
        }
      }
    }

    db.exec("COMMIT;");
    console.log(
      `Successfully seeded ${seededCount} users into the 'users' table.`
    );
    if (failedToCreateCount > 0) {
      console.warn(
        `${failedToCreateCount} users were skipped due to unique constraint violations.`
      );
    }
  } catch (error) {
    console.error("Error during user seeding transaction:", error);
    try {
      db.exec("ROLLBACK;");
      console.log("Transaction rolled back due to error.");
    } catch (rollbackError) {
      console.error("Failed to rollback transaction:", rollbackError);
    }
  } finally {
    console.log("User seeding script finished.");
  }
}

if (import.meta.main) {
  console.log("Running user seeding script directly with Bun...");
  seedUsersTable().catch((err) => {
    console.error("Seeding script failed:", err);
  });
}

export default seedUsersTable;
