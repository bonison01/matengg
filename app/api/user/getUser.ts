// /pages/api/user/getUser.ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ message: "Missing customer_id" });
  }

  const { data, error } = await supabase
    .from("users")
    .select("name")
    .eq("customer_id", customer_id)
    .single();

  if (error) return res.status(500).json({ message: error.message });
  return res.status(200).json({ data });
}
