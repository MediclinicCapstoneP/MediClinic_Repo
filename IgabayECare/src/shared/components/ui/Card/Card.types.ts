export interface CardProps {
  hover?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export interface CardHeaderProps {
  bordered?: boolean
}

export interface CardContentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export interface CardFooterProps {
  bordered?: boolean
}

export interface CardTitleProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface CardDescriptionProps {
  // No additional props needed
}
