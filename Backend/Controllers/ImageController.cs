using Backend.Data;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class ImageController(AppDbContext appDbContext) : ControllerBase
{
    private static readonly string[] AllowedExtensions = { ".png" };
    private const long MaxFileSize = 25 * 1024 * 1024;
    private const int MaxBatchCount = 20;

    [Authorize]
    [HttpGet()]
    public async Task<IActionResult> GetAllImages()
    {
        var Imgs = await appDbContext.Images.AsNoTracking().Select(x => new
        {
            x.Id,
            x.CreatedAt,
            x.Name,
            x.Height,
            x.Width
        }).OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(new { success = true, images = Imgs});
    }

    [Authorize]
    [HttpPost("upload")]
    [RequestSizeLimit(150*1024*1024)]
    public async Task<IActionResult> Upload([FromForm] BatchUploadDto dto, CancellationToken ct)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            throw new DomainException("No files uplaoded", 400);
        if (dto.Items.Count > MaxBatchCount)
            throw new DomainException("Too much files in one batch", 400);

        // Define directory paths under wwwroot
        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var thumbsDir = Path.Combine(uploadsRoot, "thumbs");
        var fullDir = Path.Combine(uploadsRoot, "full");

        Directory.CreateDirectory(thumbsDir);
        Directory.CreateDirectory(fullDir);

        var webpFullEncoder = new WebpEncoder { Quality = 85, Method = WebpEncodingMethod.Level4 };
        var webpThumbEncoder = new WebpEncoder { Quality = 75 };

        var newRecords = new List<Data.Image>();
        var savedFiles = new List<string>();

        try
        {
            foreach (var item in dto.Items)
            {
                ct.ThrowIfCancellationRequested();

                var file = item.File;
                if (file.Length == 0) continue;

                if (file.Length > MaxFileSize)
                {
                    return BadRequest($"File '{file.FileName}' exceeds 25 MB.");
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(ext))
                {
                    return BadRequest($"File '{file.FileName}' must be a PNG.");
                }

                // 1. Create DB entity and assign its ID first
                var record = new Data.Image
                {
                    Id = Guid.NewGuid(),
                    Name = string.IsNullOrWhiteSpace(item.Name)
                        ? Path.GetFileNameWithoutExtension(file.FileName)
                        : item.Name.Trim(),
                };

                // Use the DB ID as the file name
                var thumbFileName = $"{record.Id}_thumb.webp";
                var fullFileName = $"{record.Id}_full.webp";

                var thumbDiskPath = Path.Combine(thumbsDir, thumbFileName);
                var fullDiskPath = Path.Combine(fullDir, fullFileName);

                using var stream = file.OpenReadStream();
                using var image = await SixLabors.ImageSharp.Image.LoadAsync(stream, ct);

                record.Width = image.Width;
                record.Height = image.Height;

                // 2. Process and save full-screen version (cap max edge to 2560px)
                using (var fullClone = image.Clone(ctx =>
                {
                    if (image.Width > 2560 || image.Height > 2560)
                    {
                        ctx.Resize(new ResizeOptions
                        {
                            Size = new Size(2560, 2560),
                            Mode = ResizeMode.Max
                        });
                    }
                }))
                {
                    await fullClone.SaveAsync(fullDiskPath, webpFullEncoder, ct);
                    savedFiles.Add(fullDiskPath);
                }

                // 3. Process and save grid thumbnail (max 500px)
                using (var thumbClone = image.Clone(ctx =>
                {
                    ctx.Resize(new ResizeOptions
                    {
                        Size = new Size(500, 500),
                        Mode = ResizeMode.Max
                    });
                }))
                {
                    await thumbClone.SaveAsync(thumbDiskPath, webpThumbEncoder, ct);
                    savedFiles.Add(thumbDiskPath);
                }

                newRecords.Add(record);
            }

            // 4. Save all records to the database in a single transaction
            await appDbContext.Images.AddRangeAsync(newRecords, ct);
            await appDbContext.SaveChangesAsync(ct);

            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            return Ok(newRecords.Select(r => new
            {
                r.Id,
                fullUrl = $"${baseUrl}/uploads/full/{r.Id}_full.webp",
                thumbnailUrl = $"${baseUrl}/uploads/thumb/{r.Id}_thumb.webp",
                r.Width,
                r.Height
            }));
        }
        catch (Exception)
        {
            // Clean up any files written to disk if DB insert fails
            foreach (var path in savedFiles)
            {
                if (System.IO.File.Exists(path))
                {
                    System.IO.File.Delete(path);
                }
            }
            throw;
        }
    }
    
    [Authorize]
    [HttpDelete()]
    public async Task<IActionResult> DeleteImage(DeleteImageDto dto, CancellationToken ct = default)
    {
        var img = await appDbContext.Images.FirstOrDefaultAsync(x => x.Id == dto.Id)
            ?? throw new DomainException("Unknown image", 400);

        var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var thumbDiskPath = Path.Combine(webRoot, "uploads", "thumbs", $"{img.Id}_thumb.webp");
        var fullDiskPath = Path.Combine(webRoot, "uploads", "full", $"{img.Id}_full.webp");

        // 3. Remove DB record first
        appDbContext.Images.Remove(img);
        await appDbContext.SaveChangesAsync(ct);

        DeleteFileIfExists(thumbDiskPath);
        DeleteFileIfExists(fullDiskPath);
        return Ok(new {success = true});
    }
    private static void DeleteFileIfExists(string filePath)
    {
        try
        {
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
        catch (IOException)
        {
            // Log error/warning (e.g., file in use or locked by OS process)
        }
        catch (UnauthorizedAccessException)
        {
            // Log permission error
        }
    }
}