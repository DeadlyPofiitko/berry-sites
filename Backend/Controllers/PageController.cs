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
        var Page = await appDbContext.PageContents.AsNoTracking()
                            .Where(x => x.Language == dto.Language && x.Page.Url == dto.Url)
                            .Select(x => new
                            {
                                x.Title,
                                x.Subtitle,
                                Patterns = x.Page.Patterns.Select(p => new
                                {
                                    p.Order,
                                    Images = p.ImagePatterns.Select(i => new
                                    {
                                        i.ImageId,
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
                                x.Url,
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
                                x.Url,
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
        if (await appDbContext.Pages.AnyAsync(x => x.Url == dto.Url))
            throw new DomainException("Already used url", 400);

        var newPage = new Page
        {
            Url = dto.Url,
            PageType = dto.PageType 
        };
        appDbContext.Pages.Add(newPage);
        await appDbContext.SaveChangesAsync();
        return Ok(new {success = true, PageId = newPage.Id});
    }
    
    [Authorize]
    [HttpPatch]
    public async Task<IActionResult> UpdatePage(UpdatePageDto dto)
    {
        
    }
}