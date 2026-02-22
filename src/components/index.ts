/**
 * Tuned Podcast Player - Component Barrel Export
 *
 * Re-exports all reusable UI components from a single entry point so
 * consumers can import like:
 *
 *   import { Button, PodcastCard, MiniPlayer } from '../components';
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export { default as Button } from './common/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './common/Button';

export { default as Badge } from './common/Badge';
export type { BadgeProps, BadgeTier, BadgeSize } from './common/Badge';

export { default as SearchBar } from './common/SearchBar';
export type { SearchBarProps } from './common/SearchBar';

export { default as LoadingSpinner } from './common/LoadingSpinner';
export type { LoadingSpinnerProps } from './common/LoadingSpinner';

export { default as EmptyState } from './common/EmptyState';
export type { EmptyStateProps } from './common/EmptyState';

export { default as CategoryChip } from './common/CategoryChip';
export type { CategoryChipProps } from './common/CategoryChip';

// ---------------------------------------------------------------------------
// Podcast
// ---------------------------------------------------------------------------

export { default as PodcastCard } from './podcast/PodcastCard';
export type { PodcastCardProps, PodcastCardVariant } from './podcast/PodcastCard';

export { default as EpisodeCard } from './podcast/EpisodeCard';
export type { EpisodeCardProps } from './podcast/EpisodeCard';

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export { default as MiniPlayer } from './player/MiniPlayer';
export type { MiniPlayerProps } from './player/MiniPlayer';

export { default as PlayButton } from './player/PlayButton';
export type { PlayButtonProps, PlayButtonSize, PlayButtonVariant } from './player/PlayButton';

export { default as ProgressBar } from './player/ProgressBar';
export type { ProgressBarProps } from './player/ProgressBar';

export { default as DownloadButton } from './player/DownloadButton';
export type { DownloadButtonProps, DownloadStatus } from './player/DownloadButton';
