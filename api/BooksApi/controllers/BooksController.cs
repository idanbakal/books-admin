using BooksApi.Data;
using BooksApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Deltas;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OData.Formatter;

namespace BooksApi.Controllers;

public class BooksController : ODataController
{
    private readonly AppDbContext _db;

    public BooksController(AppDbContext db) => _db = db;

    // GET /odata/Books
    [EnableQuery]
    public async Task<IActionResult> Get(ODataQueryOptions<Book> options)
    {
        try
        {
            IQueryable<Book> q = _db.Books.AsNoTracking();

            var applied = (IQueryable<Book>)options.ApplyTo(q);
            var list = await applied.ToListAsync();

            return Ok(list);
        }
        catch (Exception ex)
        {
            return Problem(
                title: "Failed to fetch books",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    }

    // GET /odata/Books(1)
    [EnableQuery]
    public async Task<IActionResult> Get([FromODataUri] long key, ODataQueryOptions<Book> options)
    {
        try
        {
            var baseQuery = _db.Books.Where(b => b.Id == key).AsNoTracking();
            var applied = (IQueryable<Book>)options.ApplyTo(baseQuery);

            var list = await applied.ToListAsync();
            return Ok(list.Count == 0 ? null : list[0]);
        }
        catch (Exception ex)
        {
            return Problem(
                title: "Failed to fetch book",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    }

    // POST /odata/Books
    public async Task<IActionResult> Post([FromBody] Book book)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        _db.Books.Add(book);
        await _db.SaveChangesAsync();

        return Created(book);
    }

    // PATCH /odata/Books(1)
    public async Task<IActionResult> Patch([FromODataUri] long key, [FromBody] Delta<Book> delta)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _db.Books.FindAsync(key);
        if (existing == null) return NotFound();

        delta.Patch(existing);
        await _db.SaveChangesAsync();

        return Updated(existing);
    }

    // DELETE /odata/Books(1)
    public async Task<IActionResult> Delete([FromODataUri] long key)
    {
        var existing = await _db.Books.FindAsync(key);
        if (existing == null) return NotFound();

        _db.Books.Remove(existing);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
