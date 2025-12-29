import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

export type Book = {
  id: number;
  title: string;
  author: string;
  price: number;
  imageUrl: string | null;
};

type ODataResponse<T> = { value: T[] };

type ODataBook = {
  Id?: number;
  Title?: string;
  Author?: string;
  Price?: number;
  ImageUrl?: string | null;
};

@Injectable({ providedIn: 'root' })
export class BooksService {
  // ✅ endpoint הנכון לרשימת ספרים
  private readonly booksUrl = 'https://books-api-zepw.onrender.com/odata/Books';

  constructor(private http: HttpClient) {}

  list(opts: { search?: string; orderBy?: 'Id' | 'Title' | 'Price'; desc?: boolean; top?: number; skip?: number } = {}) {
    let params = new HttpParams();

    const sortField = opts.orderBy ?? 'Id';
    params = params.set('$orderby', `${sortField} ${opts.desc ? 'desc' : 'asc'}`);

    if (opts.top != null) params = params.set('$top', String(opts.top));
    if (opts.skip != null) params = params.set('$skip', String(opts.skip));

    if (opts.search) {
      const s = opts.search.replace(/'/g, "''");
      params = params.set('$filter', `contains(Title,'${s}') or contains(Author,'${s}')`);
    }

    return this.http.get<ODataResponse<ODataBook>>(this.booksUrl, { params }).pipe(
      map(res => (res?.value ?? []).map(b => this.toBook(b)))
    );
  }

  add(payload: Omit<Book, 'id'>) {
    const body = {
      Title: payload.title,
      Author: payload.author,
      Price: payload.price,
      ImageUrl: payload.imageUrl ?? null,
    };
    return this.http.post(this.booksUrl, body);
  }

  patch(id: number, payload: Omit<Book, 'id'>) {
    const body = {
      Title: payload.title,
      Author: payload.author,
      Price: payload.price,
      ImageUrl: payload.imageUrl ?? null,
    };
    return this.http.patch(`${this.booksUrl}(${id})`, body);
  }

  delete(id: number) {
    return this.http.delete(`${this.booksUrl}(${id})`);
  }

  private toBook(b: ODataBook): Book {
    const priceNum = Number(b.Price ?? 0);
    return {
      id: Number(b.Id ?? 0),
      title: String(b.Title ?? ''),
      author: String(b.Author ?? ''),
      price: Number.isFinite(priceNum) ? priceNum : 0,
      imageUrl: b.ImageUrl ?? null,
    };
  }
}
