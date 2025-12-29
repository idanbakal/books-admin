using System.ComponentModel.DataAnnotations.Schema;

namespace BooksApi.Models;

[Table("books")]
public class Book
{
    [Column("id")]
    public long Id { get; set; }

    [Column("title")]
    public string Title { get; set; } = "";

    [Column("author")]
    public string Author { get; set; } = "";

    [Column("price")]
    public decimal Price { get; set; }

    [Column("imageUrl")]
    public string? ImageUrl { get; set; }
}
