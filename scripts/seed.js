const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL and SUPABASE_ANON_KEY must be set (see .env).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const products = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "backend", "data", "products.json"),
      "utf8"
    )
  );

  for (const product of products) {
    const { error } = await supabase
      .from("products")
      .upsert(product, { onConflict: "id" });
    if (error) {
      console.error(`Failed to seed "${product.name}":`, error.message);
      process.exit(1);
    }
  }

  console.log(`Seeded ${products.length} products into Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
