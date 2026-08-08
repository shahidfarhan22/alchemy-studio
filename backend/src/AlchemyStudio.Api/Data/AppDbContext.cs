using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Entities are added starting at M1 (auth) / M2 (catalog).
}
