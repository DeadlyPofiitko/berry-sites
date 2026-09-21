using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class NavController(AppDbContext appDbContext) : ControllerBase
{
    [HttpGet("public")]
    public async Task<IActionResult> GetNavLinks([FromQuery] GetNavLinksDto dto)
    {
        var Links = await appDbContext.NavLinkContents.AsNoTracking()
                            .Where(x => x.Language == dto.Language)     
                            .Select(x => new
                            {
                                x.Name,
                                x.NavLink.Order,
                                x.NavLink.Url,
                            }).ToListAsync();
        return Ok(Links);
    }

    [Authorize]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAllNavLinks()
    {
        var Links = await appDbContext.NavLinks.AsNoTracking()    
                            .Select(x => new GetAllLinksDto
                            (
                                x.Id,
                                x.Url,
                                x.Order,
                                x.Contents.Select(u => new GetAllLinkContentsDto
                                (
                                    u.Language,
                                    u.Name
                                )).ToList()
                            )).ToListAsync();
        return Ok(Links);
    }

    [Authorize]
    [HttpPost()]
    public async Task<IActionResult> SyncNavLinks(SyncNavLinksDto dto)
    {
        var OrderInts = new HashSet<int>();
        var ExistingLinks = await appDbContext.NavLinks.Include(x => x.Contents).ToDictionaryAsync(x => x.Id);
        foreach (NavLinkDto navLinkDto in dto.NavLinkDtos)
        {
            if (OrderInts.Contains(navLinkDto.Order))
                throw new DomainException("Same order numbers", 400);
            Console.WriteLine(navLinkDto); 
            OrderInts.Add(navLinkDto.Order);
            if (ExistingLinks.TryGetValue(navLinkDto.Id, out var Link))
            {
                ExistingLinks.Remove(navLinkDto.Id);
                Link.Url = navLinkDto.Url;
                Link.Order = navLinkDto.Order;

                foreach (var value in Enum.GetValues<Language>())
                {
                    var existingContent = Link.Contents.Find(x => x.Language == value);
                    var newContent = navLinkDto.Contents.Find(x => x.Language == value);
                    
                    if (newContent is null && existingContent is not null)
                        appDbContext.NavLinkContents.Remove(existingContent);
                    if (newContent is not null && existingContent is null)
                        appDbContext.Add(new NavLinkContent
                        {
                            Name = newContent.Name,
                            NavLink = Link,
                            Language = newContent.Language
                        });
                    if (newContent is not null && existingContent is not null)
                        existingContent.Name = newContent.Name;
                }
            } else
            {
                appDbContext.NavLinks.Add(new NavLink
                {
                    Url = navLinkDto.Url,
                    Order = navLinkDto.Order,
                    Contents = [.. navLinkDto.Contents.Select(x => new NavLinkContent
                    {
                        Name = x.Name,
                        Language = x.Language,
                    })]
                });
            }
        }
        
        appDbContext.NavLinks.RemoveRange(ExistingLinks.Values);
        await appDbContext.SaveChangesAsync();
        return Ok( new {success = true });
    }
}