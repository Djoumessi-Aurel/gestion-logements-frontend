import Image from 'next/image';
import logo from '@/public/web-app-manifest-192x192.png';

/**
 * Logo de l'application, point unique d'usage de l'image de marque.
 *
 * Passe par next/image plutôt que par une balise <img> : le fichier source fait
 * 192×192 pour 62 Ko alors qu'il est affiché entre 24 et 56 px. Next sert une
 * version redimensionnée et convertie (WebP/AVIF selon le navigateur), sur
 * chaque page de l'application.
 *
 * L'import statique fournit les dimensions à la compilation et garantit que le
 * fichier existe — un chemin en chaîne de caractères ne serait vérifié qu'à
 * l'exécution.
 */

interface Props {
  /** Côté en pixels — l'image est carrée. */
  size?: number;
  /** Classes utilitaires (arrondi, marges, shrink-0…). */
  className?: string;
  /** Texte alternatif, à adapter selon le contexte. */
  alt?: string;
  /** À activer quand le logo fait partie du premier rendu visible (LCP). */
  priority?: boolean;
}

export default function Logo({
  size = 36,
  className = '',
  alt = 'Gestion de Logements',
  priority = false,
}: Props) {
  return (
    <Image
      src={logo}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
