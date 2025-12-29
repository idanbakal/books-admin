import { Component, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from './src/app/services/books.service';

type NewBookForm = {
  title: string;
  author: string;
  price: number | null;
  imageUrl: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  search = '';
  isLoading = false;

  books = signal<Book[]>([]);
  editingBook: Book | null = null;

  orderBy: 'Id' | 'Price' | 'Title' = 'Id';
  desc = false;
  top = 200;

  newBook: NewBookForm = {
    title: '',
    author: '',
    price: null,
    imageUrl: '',
  };

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private booksApi: BooksService) {}

  blockMinus(e: KeyboardEvent) {
    if (e.key === '-' || e.key === 'Minus') e.preventDefault();
  }

  blockMinusPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    if (text.includes('-')) e.preventDefault();
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadBooks(), 250);
  }

  toggleSort(field: 'Id' | 'Price' | 'Title') {
    if (this.orderBy === field) this.desc = !this.desc;
    else {
      this.orderBy = field;
      this.desc = false;
    }
    this.loadBooks();
  }

  clearSearch() {
    this.search = '';
    this.loadBooks();
  }

  isSafeImage(url: string | null | undefined): boolean {
  if (!url) return false;
  // אם זו תמונת base64 ענקית - לא מציגים
  return !url.startsWith('data:');
}

  private errMsg(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e: any = err;
      if (e.error) {
        if (typeof e.error === 'string') return e.error;
        try { return JSON.stringify(e.error); } catch { return String(e.error); }
      }
      if (e.message) return String(e.message);
      if (e.status) return `HTTP ${e.status} ${e.statusText ?? ''}`.trim();
    }
    return String(err);
  }

  loadBooks(): void {
    this.isLoading = true;

    this.booksApi.list({
      search: this.search,
      orderBy: this.orderBy,
      desc: this.desc,
      top: this.top,
    }).subscribe({
      next: (items) => {
        this.books.set(items);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        alert('שגיאה בטעינת ספרים: ' + this.errMsg(err));
      },
    });
  }

  addBook(): void {
    const title = this.newBook.title.trim();
    const author = this.newBook.author.trim();
    const price = Number(this.newBook.price ?? 0);

    if (!title || !author) return alert('יש למלא שם ספר ומחבר');
    if (price < 1) return alert('מחיר חייב להיות לפחות 1');

    this.booksApi.add({
      title,
      author,
      price,
      imageUrl: this.newBook.imageUrl.trim() || null,
    }).subscribe({
      next: () => {
        this.newBook = { title: '', author: '', price: 1, imageUrl: '' };
        this.loadBooks();
      },
      error: (err) => alert('שגיאה בהוספת ספר: ' + this.errMsg(err)),
    });
  }

  deleteBook(book: Book): void {
    this.booksApi.delete(book.id).subscribe({
      next: () => {
        if (this.editingBook?.id === book.id) this.editingBook = null;
        this.loadBooks();
      },
      error: (err) => alert('שגיאה במחיקה: ' + this.errMsg(err)),
    });
  }

  startEdit(book: Book): void {
    this.editingBook = { ...book };
  }

  saveEdit(originalBook: Book): void {
    if (!this.editingBook) return;

    const title = this.editingBook.title.trim();
    const author = this.editingBook.author.trim();
    const price = Number(this.editingBook.price ?? 0);

    if (!title || !author) return alert('שם ספר ומחבר חובה');
    if (price < 1) return alert('מחיר חייב להיות לפחות 1');

    this.booksApi.patch(originalBook.id, {
      title,
      author,
      price,
      imageUrl: (this.editingBook.imageUrl ?? '').toString().trim() || null,
    }).subscribe({
      next: () => {
        this.editingBook = null;
        this.loadBooks();
      },
      error: (err) => alert('שגיאה בשמירה: ' + this.errMsg(err)),
    });
  }

  cancelEdit(): void {
    this.editingBook = null;
  }
}
