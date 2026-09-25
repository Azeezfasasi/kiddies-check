// Shared blog data for the demo site.
// Keep this small and synchronous so it works in both server and client components.
export const blogPosts = [
  {
    slug: 'innovations-in-civil-engineering',
    title: 'Innovations in Civil Engineering',
    category: 'Civil',
    image: '/images/projectplaceholder.png',
    excerpt:
      'Exploring new technologies in civil engineering that are shaping modern infrastructure.',
    content: `
      <p>Exploring new technologies in civil engineering that are shaping modern infrastructure.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.</p>
    `,
  },
  {
    slug: 'sustainable-industrial-design',
    title: 'Sustainable Industrial Design',
    category: 'Industrial',
    image: '/images/projectplaceholder.png',
    excerpt:
      'How sustainable practices in industrial projects reduce costs and environmental impact.',
    content: `
      <p>How sustainable practices in industrial projects reduce costs and environmental impact.</p>
    `,
  },
  {
    slug: 'electrical-installations-best-practices',
    title: 'Electrical Installations Best Practices',
    category: 'Electrical',
    image: '/images/projectplaceholder.png',
    excerpt:
      'Key considerations for safe and efficient electrical installations in commercial buildings.',
    content: `
      <p>Key considerations for safe and efficient electrical installations in commercial buildings.</p>
    `,
  },
  {
    slug: 'project-management-in-engineering',
    title: 'Project Management in Engineering',
    category: 'Management',
    image: '/images/projectplaceholder.png',
    excerpt: 'Effective project management strategies for complex engineering projects.',
    content: `
      <p>Effective project management strategies for complex engineering projects.</p>
    `,
  },
];

export function findPostBySlug(slug) {
  return blogPosts.find((p) => p.slug === slug) || null;
}
