using BooksApi.Data;
using BooksApi.Models;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;

static IEdmModel GetEdmModel()
{
    var b = new ODataConventionModelBuilder();
    b.EntitySet<Book>("Books");
    return b.GetEdmModel();
}

var builder = WebApplication.CreateBuilder(args);

// ---- Connection string: read robustly for Render/Supabase ----
string? cs =
    builder.Configuration.GetConnectionString("Supabase")
    ?? builder.Configuration["ConnectionStrings__Supabase"]    // sometimes set directly
    ?? builder.Configuration["DATABASE_URL"];                  // some hosts use this name

if (string.IsNullOrWhiteSpace(cs))
{
    throw new InvalidOperationException(
        "Missing database connection string. Set ConnectionStrings__Supabase (recommended) " +
        "or ConnectionStrings:Supabase in configuration."
    );
}

// If someone accidentally provided a URI form (postgresql://...), convert it to key=value format.
if (cs.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
    cs.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    var uri = new Uri(cs.Replace("postgresql://", "postgres://", StringComparison.OrdinalIgnoreCase));

    var userInfo = uri.UserInfo.Split(':', 2);
    var user = Uri.UnescapeDataString(userInfo[0]);
    var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";

    var db = uri.AbsolutePath.TrimStart('/');
    if (string.IsNullOrWhiteSpace(db)) db = "postgres";

    cs =
        $"Host={uri.Host};Port={uri.Port};Database={db};Username={user};Password={pass};" +
        "SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(cs));

builder.Services.AddControllers()
    .AddOData(opt => opt
        .AddRouteComponents("odata", GetEdmModel())
        .Select().Filter().OrderBy().Expand().Count()
        .SetMaxTop(200));

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", p =>
        p.AllowAnyOrigin()
         .AllowAnyHeader()
         .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("DevCors");

app.UseRouting();
app.MapControllers();

app.MapGet("/", () => "API is running ✅");

app.Run();
