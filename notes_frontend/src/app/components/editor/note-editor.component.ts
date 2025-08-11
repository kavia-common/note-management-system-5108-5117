import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/note.model';

/**
 * PUBLIC_INTERFACE
 * NoteEditorComponent
 * Displays and edits a single note. Emits save and delete actions.
 */
@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css',
})
export class NoteEditorComponent {
  @Input() note: Note | null = null;

  @Output() save = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<string>();

  // Local mutable draft copies for two-way binding
  draftTitle = '';
  draftContent = '';

  ngOnChanges() {
    this.draftTitle = this.note?.title ?? '';
    this.draftContent = this.note?.content ?? '';
  }

  onSave() {
    if (!this.note) return;
    const updated: Note = {
      ...this.note,
      title: this.draftTitle.trim() || 'Untitled',
      content: this.draftContent,
    };
    this.save.emit(updated);
  }

  onDelete() {
    if (!this.note) return;
    this.delete.emit(this.note.id);
  }
}
