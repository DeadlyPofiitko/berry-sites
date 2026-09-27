using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class PageController(AppDbContext appDbContext) : ControllerBase
{
    [HttpGet("content")]
    public async Task<IActionResult> GetPage([FromQuery] GetPageDto dto)
    {
        var url = dto.Url.TrimStart("/").ToString();
        var Page = await appDbContext.PageContents.AsNoTracking()
                            .Where(x => x.Language == dto.Language && x.Page.Url == url)
                            .Select(x => new
                            {
                                x.Title,
                                x.Subtitle,
                                Patterns = x.Page.Patterns.Select(p => new
                                {
                                    p.Order,
                                    p.PatternType,
                                    Images = p.ImagePatterns.Select(i => new
                                    {
                                        i.ImageId,
                                        i.Image.Width,
                                        i.Image.Height,
                                        i.Order
                                    })
                                })
                            }).FirstOrDefaultAsync();
        return Ok(new { success = true, Page});
    }

    [HttpGet("comics")]
    public async Task<IActionResult> GetComicsPages([FromQuery] GetComicsPages dto)
    {
        var pages = await appDbContext.Pages.AsNoTracking()
                            .Where(x => x.PageType == PageType.COMICS)
                            .Select(x => new
                            {
                                Url = "/" + x.Url,
                                Content = x.Contents.Where(c => c.Language == dto.Language).Select(c => new
                                {
                                    c.Title,
                                    c.Subtitle
                                })
                            }).ToListAsync();
        return Ok(new { success = true, comicsPages = pages});
    }

    [Authorize]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllPages()
    {
        var pages = await appDbContext.Pages.AsNoTracking()
                            .Select(x => new
                            {
                                x.Id,
                                Url = "/" + x.Url,
                                x.PageType,
                                Contents = x.Contents.Select(c => new
                                {
                                    c.Language,
                                    c.Title,
                                    c.Subtitle
                                })
                            }).ToListAsync();
        return Ok(new { success = true, pages});
    }

    [Authorize]
    [HttpPost()]
    public async Task<IActionResult> CreatePage(CreatePageDto dto)
    {
        if (dto.Url.Length == 0)
            throw new DomainException("Url cannot be empty string", 400);
        if (await appDbContext.Pages.AnyAsync(x => x.Url == dto.Url))
            throw new DomainException("Already used url", 400);

        var newPage = new Page
        {
            Url = dto.Url.TrimStart("/").ToString(),
            PageType = dto.PageType,
        };
        SetPageContent(newPage, dto.Contents);
        appDbContext.Pages.Add(newPage);
        await appDbContext.SaveChangesAsync();
        return Ok(new {success = true, PageId = newPage.Id});
    }
    
    [Authorize]
    [HttpPatch()]
    public async Task<IActionResult> UpdatePage(UpdatePageDto dto)
    {
        var page = await appDbContext.Pages
            .Include(x => x.Contents)
            .FirstOrDefaultAsync(x => x.Id == dto.Id)
            ?? throw new DomainException("Unknown page", 400);
        if (dto.Url.Length == 0)
            throw new DomainException("Url cannot be empty string", 400);

        page.Url = dto.Url.TrimStart("/").ToString();
        SetPageContent(page, dto.Contents);
        await appDbContext.SaveChangesAsync();
        return Ok(new {success = true});
    }
    
    [Authorize]
    [HttpDelete()]
    public async Task<IActionResult> DeletePage(DeletePageDto dto)
    {
        var page = await appDbContext.Pages.FindAsync(dto.Id)
            ?? throw new DomainException("Unknown page", 400);
        appDbContext.Pages.Remove(page);
        await appDbContext.SaveChangesAsync();
        return Ok(new { success = true});
    }
    private static PageContent GetPageContent(Page page, Language language)
    {
        var content = page.Contents.Find(x => x.Language == language);
        if (content is not null) return content;

        var newContent = new PageContent
        {
            Language = language,
            Title = "",
            Subtitle = ""
        };
        page.Contents.Add(newContent);
        return newContent;
    }

    private static void SetPageContent(Page page, List<SetPageContent> setPageContents)
    { 
        foreach (var contentDto in setPageContents)
        {
            var content = GetPageContent(page, contentDto.Language);
            content.Title = contentDto.Title;
            content.Subtitle = contentDto.Subtitle;
        }
    }
}