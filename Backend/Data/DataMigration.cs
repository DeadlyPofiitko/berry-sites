using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using System.Text.Encodings.Web; // For UnicodeRanges

namespace Backend.Data;

public record MigrationPage(
    Guid Id,
    string Url,
    List<PageContent> Contents,
    PageType PageType
);

public record BackupPayload(
    DateTime ExportedAtUtc,
    int SchemaVersion,
    List<Section> Sections,
    List<Admin> Admins,
    List<MigrationPage> Pages,
    List<NavLink> Links
);

public class DataMigration
{
    private readonly AppDbContext _db;
    private readonly ILogger<DataMigration> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        // Prevents failure if entities contain cyclic navigation references
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public DataMigration(AppDbContext db, ILogger<DataMigration> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Exports database entities directly into a JSON file stream.
    /// </summary>
    public async Task ExportAsync(string destinationFilePath, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting database export to '{Path}'...", destinationFilePath);

        var fullPath = Path.GetFullPath(destinationFilePath);
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        // 1. Fetch data as read-only (AsNoTracking saves significant RAM)
        var sections = await _db.Sections
            .AsNoTracking()
            .Include(x => x.Contents)
            .ToListAsync(ct);
        var pages = await _db.Pages
            .AsNoTracking()
            .Select(x => new MigrationPage
            (
                x.Id,
                x.Url,
                x.Contents,
                x.PageType
            ))
            .ToListAsync(ct);

        var admins = await _db.Admins
            .AsNoTracking()
            .ToListAsync(ct);

        var links = await _db.NavLinks
            .AsNoTracking()
            .Include(x => x.Contents)
            .ToListAsync(ct);

        var payload = new BackupPayload
        (
            DateTime.UtcNow,
            1,
            sections,
            admins,
            pages,
            links
        );

        // 2. Stream JSON directly to file
        await using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await JsonSerializer.SerializeAsync(fileStream, payload, JsonOptions, ct);
        }

        _logger.LogInformation("Export completed successfully!");
    }

    /// <summary>
    /// Reads a JSON backup file and imports Sections, Admins, and Pages into the database.
    /// </summary>
    public async Task ImportAsync(string sourceFilePath, bool wipeExisting = false, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting database import from '{Path}'...", sourceFilePath);

        var fullPath = Path.GetFullPath(sourceFilePath);
        if (!File.Exists(fullPath))
        {
            _logger.LogError("Import file '{Path}' does not exist.", fullPath);
            throw new FileNotFoundException("Backup file not found.", fullPath);
        }

        // 1. Stream & deserialize backup payload
        BackupPayload? payload;
        await using (var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read))
        {
            payload = await JsonSerializer.DeserializeAsync<BackupPayload>(fileStream, JsonOptions, ct);
        }

        if (payload == null)
        {
            _logger.LogWarning("Import file is empty or corrupted.");
            return;
        }

        // 2. Map MigrationPage DTOs back to Page entities
        var pagesToInsert = payload.Pages.Select(p => new Page
        {
            Id = p.Id,
            Url = p.Url,
            Contents = p.Contents,
            PageType = p.PageType
        }).ToList();

        // 3. Execute inside an EF execution strategy transaction
        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                if (wipeExisting)
                {
                    _logger.LogWarning("Wiping existing database records before import...");

                    // Wipe dependent/child tables first if cascade delete isn't automatic
                    await _db.Pages.ExecuteDeleteAsync(ct);
                    await _db.Sections.ExecuteDeleteAsync(ct);
                    await _db.Admins.ExecuteDeleteAsync(ct);
                    await _db.NavLinks.ExecuteDeleteAsync(ct);
                }

                // Insert Sections (along with included Contents)
                if (payload.Sections.Count > 0)
                {
                    await _db.Sections.AddRangeAsync(payload.Sections, ct);
                }

                // Insert Admins
                if (payload.Admins.Count > 0)
                {
                    await _db.Admins.AddRangeAsync(payload.Admins, ct);
                }

                // Insert Pages (along with Contents)
                if (pagesToInsert.Count > 0)
                {
                    await _db.Pages.AddRangeAsync(pagesToInsert, ct);
                }

                if(payload.Links.Count > 0)
                {
                    await _db.NavLinks.AddRangeAsync(payload.Links, ct);
                }

                await _db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                _logger.LogInformation(
                    "Import successful: {SectionsCount} sections, {AdminsCount} admins, {PagesCount} pages, links {LinksCount} inserted.",
                    payload.Sections.Count,
                    payload.Admins.Count,
                    pagesToInsert.Count,
                    payload.Links.Count
                );
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(ct);
                _logger.LogError(ex, "Import failed. Transaction rolled back.");
                throw;
            }
        });
    }
}