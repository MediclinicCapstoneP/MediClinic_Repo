export interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export interface SkeletonTextProps {
  lines?: number
  className?: string
}

export interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface SkeletonCardProps {
  className?: string
}

export interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}
