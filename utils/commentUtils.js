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

export const generateIssueID = async (form, supabase) => {
  const lastName = form.name.split(" ").pop() || "User";
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  const newId = data?.[0]?.id
    ? String(data[0].id + 1).padStart(5, "0")
    : "00001";
  return `${lastName}-${newId}`;
};
