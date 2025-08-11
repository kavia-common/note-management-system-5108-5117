import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * PUBLIC_INTERFACE
 * TopbarComponent
 * A simple top navigation bar with:
 * - menu button (mobile) to toggle sidebar
 * - application title
 * - search input
 * - "New note" action button
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  @Input() title = 'Notes';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() createNote = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  onInput(ev: Event) {
    const target = ev.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}
