using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Authorize]
[Route("[controller]")]
public class PatternController(AppDbContext appDbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPatterns([FromQuery] GetPagePatternsDto dto)
    {
        var patterns = await appDbContext.Patterns.AsNoTracking()
            .Where(x => x.PageId == dto.PageId)
            .Select(x => new
            {
                x.Id,
                x.Order,
                x.PatternType,
                Images = x.ImagePatterns.Select(x => new
                {
                    x.Order,
                    x.ImageId,
                    x.Image.Height,
                    x.Image.Width
                })
            }).ToListAsync();
        return Ok(new { success = true, patterns});
    }

    [HttpPost]
    public async Task<IActionResult> CreatePattern(CreatePatternDto dto)
    {
        var page = await appDbContext.Pages.Include(x => x.Patterns).FirstOrDefaultAsync(x => x.Id == dto.PageId)
            ?? throw new DomainException("Unknown page", 400);
        
        var maxOrder = page.Patterns.Count > 0 ? page.Patterns.Max(x => x.Order) + 1 : 0;

        page.Patterns.Add(new Pattern
        {
            PatternType = dto.PatternType,
            Order = maxOrder
             
        });
        await appDbContext.SaveChangesAsync();
        return Ok(new {success = true});
    }

    [HttpPatch]
    public async Task<IActionResult> ChangePatterns(ChangePatternDto dto)
    {
        var patterns = await appDbContext.Patterns.Where(x => x.PageId == dto.PageId).ToDictionaryAsync(x => x.Id);
        var imagePatterns = await appDbContext.ImagePatterns
            .Where(x => patterns.Keys.Contains(x.PatternId))
            .ToDictionaryAsync(x => (x.ImageId, x.PatternId, x.Order));
        var images = await appDbContext.Images.Select(x => x.Id).ToDictionaryAsync(x => x);

        for (int i = 0; i < dto.PatternsOrder.Count; i++)
        {
            if (!patterns.TryGetValue(dto.PatternsOrder[i].PatternId, out var pattern))
                throw new DomainException("Unkonw pattern Id", 400);
            pattern.Order = i;
            var imageIds = dto.PatternsOrder[i].ImageIdsOrder;
            if (imageIds.Count > 3)
                throw new DomainException("One pattern can contain max 3 images", 400);
            
            if (imageIds.Count != 3 && pattern.PatternType == PatternType.COLUMN)
                throw new DomainException("To render this pattern. Pattern need 3 images", 400);

            for (int j = 0; j < imageIds.Count; j++)
            {
                if (imagePatterns.TryGetValue((imageIds[j], pattern.Id, j), out var imagePattern))
                {
                    imagePatterns.Remove((imageIds[j], pattern.Id, j));
                } else
                {
                    if(!images.TryGetValue(imageIds[j], out var image))
                        throw new DomainException("Unknown image", 400);
                    pattern.ImagePatterns.Add(new ImagePattern
                    {
                        ImageId = imageIds[j],
                        Order = j
                    });
                }    
            }
        }
        appDbContext.ImagePatterns.RemoveRange(imagePatterns.Values);
        await appDbContext.SaveChangesAsync();

        return Ok(new { success = true});
    }
    
    [HttpDelete]
    public async Task<IActionResult> DeletePattern(DeletePatternDto dto)
    {
        var pattern = await appDbContext.Patterns.FindAsync(dto.PatternId)
            ?? throw new DomainException("Unknown pattern", 400);
        appDbContext.Patterns.Remove(pattern);
        await appDbContext.Patterns
            .Where(x => x.Order > pattern.Order)
            .ExecuteUpdateAsync(x => x.SetProperty(x => x.Order, x => x.Order - 1));
        await appDbContext.SaveChangesAsync();
        return Ok(new { success = true});
    }
}