import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TopbarComponent } from './components/topbar/topbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NoteEditorComponent } from './components/editor/note-editor.component';
import { NotesService } from './services/notes.service';
import { Note } from './models/note.model';

/**
 * PUBLIC_INTERFACE
 * AppComponent
 * This is the root component that composes the top navigation bar, sidebar list of notes,
 * and the main editor area. It orchestrates search, selection, and CRUD operations via NotesService.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SidebarComponent, NoteEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  /** Title used in topbar */
  title = 'Notes';

  /** Sidebar visibility for small screens */
  sidebarOpen = signal<boolean>(true);

  /** Search term state */
  search = signal<string>('');

  private readonly notesService = inject(NotesService);

  /** Notes and selection derived from the service */
  notes = this.notesService.notes;
  selectedId = this.notesService.selectedId;

  /** Filtered notes based on search */
  filteredNotes = computed<Note[]>(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.notes();
    return this.notes().filter(n =>
      n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
    );
  });

  /** Selected note object */
  selectedNote = computed<Note | null>(() => {
    const id = this.selectedId();
    return this.notes().find(n => n.id === id) ?? null;
  });

  ngOnInit() {
    // Load initial data
    this.notesService.init();

    // Auto-select the first note if none selected
    effect(() => {
      const list = this.notes();
      const current = this.selectedId();
      if (list.length && (!current || !list.some(n => n.id === current))) {
        this.notesService.select(list[0].id);
      }
    });
  }

  onToggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onSearch(term: string) {
    this.search.set(term);
  }

  async onCreateNote() {
    const created = await this.notesService.create({
      title: 'Untitled note',
      content: '',
    });
    this.notesService.select(created.id);
    this.sidebarOpen.set(false); // close sidebar on mobile
  }

  onSelectNote(id: string) {
    this.notesService.select(id);
    this.sidebarOpen.set(false); // close sidebar on mobile
  }

  async onSave(note: Note) {
    await this.notesService.update(note);
  }

  async onDelete(id: string) {
    const hasConfirm = typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function';
    const ok = hasConfirm ? (globalThis as any).confirm('Delete this note? This action cannot be undone.') : true;
    if (!ok) return;
    await this.notesService.delete(id);
  }
}
