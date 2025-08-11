import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Note } from '../models/note.model';

/**
 * PUBLIC_INTERFACE
 * NotesService
 * Handles CRUD operations for notes via HTTP REST API (if available) with a robust local fallback.
 * - API base URL: window['NOTES_API_BASE'] || '/api'
 * - Endpoints expected:
 *    GET    {base}/notes
 *    POST   {base}/notes
 *    PUT    {base}/notes/{id}
 *    DELETE {base}/notes/{id}
 * If the backend is unavailable, operations are performed using localStorage as a mock store.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiBase = (globalThis as any)['NOTES_API_BASE'] || '/api';

  // Reactive state using Angular signals
  readonly notes = signal<Note[]>([]);
  readonly selectedId = signal<string | null>(null);

  private localKey = 'notes_app_data_v1';

  private readonly http = inject(HttpClient);

  /**
   * PUBLIC_INTERFACE
   * init
   * Initialize the notes data by attempting to load from the backend, falling back to localStorage.
   */
  init(): void {
    this.fetchFromApi()
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          this.notes.set(this.sortByUpdated(data));
          this.persistLocal();
        } else {
          this.loadFromLocalOrSeed();
        }
      })
      .catch(() => this.loadFromLocalOrSeed());
  }

  /**
   * PUBLIC_INTERFACE
   * select
   * Select a note by ID.
   */
  select(id: string) {
    this.selectedId.set(id);
  }

  /**
   * PUBLIC_INTERFACE
   * create
   * Create a new note with optional title/content.
   */
  async create(data: { title?: string; content?: string }): Promise<Note> {
    const now = new Date().toISOString();
    const toCreate: Partial<Note> = {
      title: data.title ?? 'Untitled',
      content: data.content ?? '',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await firstValueFrom(this.http.post<Note>(`${this.apiBase}/notes`, toCreate));
      this.notes.set(this.sortByUpdated([created, ...this.notes()]));
      this.persistLocal();
      return created;
    } catch {
      // Local fallback
      const localCreated: Note = { id: this.generateId(), ...(toCreate as any) };
      this.notes.set(this.sortByUpdated([localCreated, ...this.notes()]));
      this.persistLocal();
      return localCreated;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * update
   * Update an existing note.
   */
  async update(note: Note): Promise<Note> {
    const updated: Note = { ...note, updatedAt: new Date().toISOString() };

    try {
      const res = await firstValueFrom(
        this.http.put<Note>(`${this.apiBase}/notes/${encodeURIComponent(note.id)}`, updated)
      );
      this.replaceLocal(res);
      return res;
    } catch {
      // Local fallback
      this.replaceLocal(updated);
      return updated;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * delete
   * Delete a note by id.
   */
  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.apiBase}/notes/${encodeURIComponent(id)}`));
      this.removeLocal(id);
    } catch {
      // Local fallback
      this.removeLocal(id);
    }
  }

  // Internal helpers

  private generateId(): string {
    try {
      const g = globalThis as any;
      if (g?.crypto && typeof g.crypto.randomUUID === 'function') {
        return g.crypto.randomUUID();
      }
    } catch {
      // ignore and fallback
    }
    // Fallback: not cryptographically strong, but sufficient for UI mock
    return 'id-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
  }

  private async fetchFromApi(): Promise<Note[]> {
    return await firstValueFrom(this.http.get<Note[]>(`${this.apiBase}/notes`));
  }

  private loadFromLocalOrSeed() {
    const ls = (globalThis as any).localStorage as Storage | undefined;
    const raw = ls?.getItem(this.localKey) ?? null;
    if (raw) {
      const list = JSON.parse(raw) as Note[];
      this.notes.set(this.sortByUpdated(list));
      return;
    }
    // Seed demo data
    const now = new Date();
    const seed: Note[] = [
      {
        id: this.generateId(),
        title: 'Welcome to Notes',
        content:
          'This is your new notes app. Create, search, and edit your notes.\n\nTip: Use the search bar to quickly find content.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: this.generateId(),
        title: 'Meeting ideas',
        content: '- Prepare agenda\n- Assign roles\n- Timebox discussions',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: this.generateId(),
        title: 'Shopping list',
        content: 'Milk\nEggs\nBread\nCoffee',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
    this.notes.set(this.sortByUpdated(seed));
    this.persistLocal();
  }

  private replaceLocal(updated: Note) {
    const list = this.notes().map((n) => (n.id === updated.id ? updated : n));
    this.notes.set(this.sortByUpdated(list));
    this.persistLocal();
  }

  private removeLocal(id: string) {
    const list = this.notes().filter((n) => n.id !== id);
    this.notes.set(this.sortByUpdated(list));
    this.persistLocal();

    // Reset selection if deleted
    if (this.selectedId() === id) {
      this.selectedId.set(list[0]?.id ?? null);
    }
  }

  private persistLocal() {
    try {
      const ls = (globalThis as any).localStorage as Storage | undefined;
      ls?.setItem(this.localKey, JSON.stringify(this.notes()));
    } catch {
      // ignore quota/storage errors
    }
  }

  private sortByUpdated(list: Note[]) {
    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    }
}
