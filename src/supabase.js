import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yotgqskbrpfkjgrasjjx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdGdxc2ticnBma2pncmFzamp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDc5NzQsImV4cCI6MjA5MzA4Mzk3NH0.OGZ1CpOvyIl9CSPd-uWsA9kmet6HK0KTIIo99K03YoI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
