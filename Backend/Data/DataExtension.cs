

using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DataExtension
{
    public static async Task SeedDb(AppDbContext context)
    {
        if (!await context.Admins.AnyAsync())
        {
            var admin = new Admin
            {
                Email = "jakvortel@gmail.com"    
            };
            context.Admins.Add(admin);
            await context.SaveChangesAsync();
        }
    }
}