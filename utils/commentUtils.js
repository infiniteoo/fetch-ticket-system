export async function fetchComments(ticketId, supabase) {
  console.log("Fetching comments for ticket:", ticketId);
  let { data, error } = await supabase
    .from("comments")
    .select("text, created_at, commenter_name, image_url") // ✅ Include image_url
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false }); // Newest first

  if (!error) {
    return data;
  } else {
    console.error("Error fetching comments:", error);
  }
}
