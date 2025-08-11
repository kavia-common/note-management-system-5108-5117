import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Note } from '../../models/note.model';

/**
 * PUBLIC_INTERFACE
 * SidebarComponent
 * Displays the list of notes in the sidebar. Emits the selected note id.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() notes: Note[] = [];
  @Input() selectedId: string | null = null;

  @Output() select = new EventEmitter<string>();

  preview(content: string): string {
    const text = content.replace(/\s+/g, ' ').trim();
    return text.length > 80 ? text.slice(0, 80) + '…' : text;
  }
}
