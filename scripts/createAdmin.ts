// scripts/createAdmin.ts
//
// Run once (or whenever you need to add an admin) with:
//   npx tsx scripts/createAdmin.ts
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your
// .env, and the `admins` table created via sql/001_create_admins_table.sql.
//
// Install once if missing: npm install bcryptjs tsx --save-dev

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import readline from "readline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

async function main() {
  const emailOrPhone = await prompt("Email or phone for the new admin: ");
  const name = await prompt("Name (optional): ");
  const password = await prompt("Password: ");

  if (!emailOrPhone || !password) {
    console.error("Email/phone and password are required.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("admins").insert({
    email_or_phone: emailOrPhone,
    password_hash: passwordHash,
    name: name || null,
    role: "admin",
  });

  if (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }

  console.log(`Admin created: ${emailOrPhone}`);
}

main();