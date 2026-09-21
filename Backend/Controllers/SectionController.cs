using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class ContentController(AppDbContext appDbContext) : ControllerBase
{
    [HttpGet("content")]
    public async Task<IActionResult> GetContentOfSection([FromQuery] GetContentDto dto)
    {
        var content = await appDbContext.SectionContents.AsNoTracking()
                                .Where(x => x.Language == dto.Language && x.Section.Name == dto.Name)
                                .Select(x => x.Json).FirstAsync();
        return Ok(new { content });
    }

    [Authorize]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllSections()
    {
    var sections = await appDbContext.Sections
        .AsNoTracking()
        .Select(x => new
        {
            x.Id,
            x.Name,
            Contents = x.Contents.Select(c => new
            {
                c.Id,
                c.Language,
                c.Json
            }).ToList()
        })
        .ToListAsync();
        return Ok(new { sections });
    }

    [Authorize]
    [HttpPost()]
    public async Task<IActionResult> CreateSection(CreateSectionDto dto)
    {
        if(await appDbContext.Sections.AnyAsync(x => x.Name == dto.Name))
            throw new DomainException("Section with this name exists", 400);
        var newSection = new Section
        {
            Name = dto.Name,
            Contents = Enum.GetValues<Language>().Select(x => new SectionContent
            {
                Language = x,
                Json = "{}"
            }).ToList()
        }; 
        appDbContext.Sections.Add(newSection);
        await appDbContext.SaveChangesAsync();
        return Ok(new {success = true, section = newSection});
    }

    [Authorize]
    [HttpPatch()]
    public async Task<IActionResult> UpdateSectionContent(List<UpdateSectionContentDto> dtos)
    {
        var ExistingContents = await appDbContext.SectionContents.ToDictionaryAsync(x => x.Id);
        foreach (var dto in dtos)
        {
            if (!ExistingContents.TryGetValue(dto.Id, out var content))
                throw new DomainException("Unknown content id", 400);
            content.Json = dto.Content;
        }

        await appDbContext.SaveChangesAsync();
        return Ok(new { success = true });
    }
    
    [Authorize]
    [HttpDelete()]
    public async Task<IActionResult> DeleteSection(DeleteSectionDto dto)
    {
        var section = await appDbContext.Sections.FindAsync(dto.Id)
            ?? throw new DomainException("Unknown section", 400);
        
        appDbContext.Sections.Remove(section);
        await appDbContext.SaveChangesAsync();
        return Ok(new { success = true });
    }
}