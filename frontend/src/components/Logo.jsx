import React from 'react';

/** Logo entreprise — même ressource que sur la page de connexion (`/vala-logo.png`). */
const Logo = ({ className = 'h-8 w-auto' }) => (
  <img
    src="/vala-logo.png"
    alt="Vala"
    className={`object-contain object-left select-none ${className}`}
    draggable={false}
  />
);

export default Logo;
