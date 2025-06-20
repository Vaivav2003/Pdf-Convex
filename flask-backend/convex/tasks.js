import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const check_email= query({
  args: {email: v.string()},
  handler: async (ctx, args) => {
    // Grab the user with the given email 
    const user = await ctx.db
        .query("accounts")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first()
    return user;
  },
});

export const get_user= query({
    args: {_id: v.string()},
    handler: async (ctx, args) => {
      // Grab the user with the given email 
      const user = await ctx.db
          .query("accounts")
          .filter((q) => q.eq(q.field("_id"), args._id))
          .first()
      return user;
    },
});

export const createAccount = mutation({
  args: { username: v.string(),email: v.string(), password: v.string() },
  handler: async (ctx, { username, email, password }) => {
    // Hash the password before storing it
    //const hashedPassword = await bcrypt.hash(password, 10);

    // Insert a new account with the provided username and hashed password
    await ctx.db.insert("accounts", { username, email, password });
  },
});

export const pdf_history = mutation({
  args: { pdf_name: v.string(),actual_pdf_name: v.string(),user_id: v.string(),upload_date: v.string() },
  handler: async (ctx, { pdf_name,actual_pdf_name, user_id,upload_date }) => {

    // Insert a new pdf
    await ctx.db.insert("pdf_list", { pdf_name,actual_pdf_name, user_id,upload_date });
  },
});

export const get_pdf_name = query({
  args: {_id: v.string()},
  handler: async (ctx, args) => {
    // Grab the user with the given email 
    const pdf = await ctx.db
        .query("pdf_list")
        .filter((q) => q.eq(q.field("_id"), args._id))
        .first()
    return pdf;
  },
});

export const pdf_details = query({
  args: {user_id: v.string()},
  handler: async (ctx, args) => {
    // Grab the user with the given email 
    const pdfdetails = await ctx.db
        .query("pdf_list")
        .filter((q) => q.eq(q.field("user_id"), args.user_id))
        .order("desc")
        .collect()
    return pdfdetails;
  },
});

export const deletepdf = mutation({
  args: { id: v.id("pdf_list") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});