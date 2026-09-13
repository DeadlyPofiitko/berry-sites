
using System.Security.Claims;
using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;


[Authorize]
[ApiController]
[Route("[controller]")]
public class AdminController(
    AppDbContext appDbContext
) : ControllerBase
{
    protected Guid AdminId
    {
        get
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(idClaim, out var guid) ? guid : throw new DomainException("Unknown user", 400);
        }
    }
    [HttpGet("me")]
    public async Task<IActionResult> GetAdmin()
    {
        return Ok(await appDbContext.Admins.AsNoTracking().Where(x => x.Id == AdminId).Select(x => new
        {
            x.Id,
            x.Email,
            x.Picture,
            x.Name
        }).FirstOrDefaultAsync());
    }
    [HttpGet()]
    public async Task<IActionResult> GetAmins()
    {
        return Ok(await appDbContext.Admins.AsNoTracking().Select(x => new
        {
            x.Email,
            x.Name,
            x.Picture
        }).ToListAsync());
    }
    [HttpPost()]
    public async Task<IActionResult> AddAdmin(AddAdminDto dto)
    {
        if (await appDbContext.Admins.AnyAsync(x => x.Email == dto.Email))
            throw new DomainException("Used email", 400);
        var admin = new Admin
        {
            Email = dto.Email
        };
        appDbContext.Admins.Add(admin);
        await appDbContext.SaveChangesAsync();
        return Ok(new { success = true} );
    }
    [HttpDelete]
    public async Task<IActionResult> DeleteAdmin(DeleteAdminDto dto)
    {
        var admin = await appDbContext.Admins.FirstOrDefaultAsync(x => x.Email == dto.Email)
            ?? throw new DomainException("Unknown Admin", 400);
        appDbContext.Admins.Remove(admin);
        await appDbContext.SaveChangesAsync();

        return Ok(new { success = true});
    }
}