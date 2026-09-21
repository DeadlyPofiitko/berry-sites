using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<Pattern> Patterns => Set<Pattern>();
    public DbSet<ImagePattern> ImagePatterns => Set<ImagePattern>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<PageContent> PageContents => Set<PageContent>();
    public DbSet<SectionContent> SectionContents => Set<SectionContent>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<NavLinkContent> NavLinkContents => Set<NavLinkContent>();
    public DbSet<NavLink> NavLinks => Set<NavLink>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SectionContent>()
            .HasIndex(x => new { x.SectionId, x.Language })
            .IsUnique();
        
        modelBuilder.Entity<NavLinkContent>()
            .HasIndex(x => new { x.NavLinkId, x.Language})
            .IsUnique();
        modelBuilder.Entity<Section>()
            .HasIndex(x => x.Name)
            .IsUnique();
        modelBuilder.Entity<PageContent>()
            .HasIndex(x => new {x.PageId, x.Language})
            .IsUnique();
        modelBuilder.Entity<PageContent>()
            .HasIndex(x => new {x.Title, x.Language})
            .IsUnique();
        modelBuilder.Entity<ImagePattern>()
            .HasIndex(x => new {x.Order, x.PatternId})
            .IsUnique();
        modelBuilder.Entity<ImagePattern>()
            .HasKey(x => new { x.ImageId, x.PatternId });
        modelBuilder.Entity<Page>()
            .HasIndex(x => x.Url)
            .IsUnique();
    }
}