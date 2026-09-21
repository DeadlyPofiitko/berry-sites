using System.Text;
using Backend.Data;
using Backend.ErrorHandling;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
var corsPolicyName = "AllowAstroClient";
Env.TraversePath().Load();
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
var jwtKey = builder.Configuration["JWT_SECRET"]
    ?? throw new Exception("No jwt secret");
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };

    // Allows the API to read the token directly from the 'auth_token' cookie
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("auth_token"))
            {
                context.Token = context.Request.Cookies["auth_token"];
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName, policy =>
    {
        policy.WithOrigins(
                "http://localhost:4321",    // Astro dev server default
                "http://127.0.0.1:4321",
                "https://berry26.cz",
                "https://berry26.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for Set-Cookie to work across origins
    });
});
builder.Services.AddAuthorization();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=berry-sites.db"));
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseExceptionHandler();
app.UseCors(corsPolicyName);
app.UseRouting();
app.UseAuthentication();
app.UseStaticFiles();
app.UseAuthorization();
app.UseHttpsRedirection();
app.MapGet("/", () =>
{
    return "Berry-sites Backend";
});

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    await DataExtension.SeedDb(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}

app.Run();