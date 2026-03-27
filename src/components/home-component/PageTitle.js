import Link from "next/link";

export default function PageTitle({ title, subtitle, breadcrumbs, link, label }) {
  return (
    // Background image section with title and optional breadcrumbs
    <section className="relative bg-gray-800 text-white py-12 overflow-hidden" style={{ backgroundImage: "url('/img/kidimg1.png')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="container mx-auto px-6 lg:px-20 relative z-10">
        <h1 className="text-4xl text-center font-bold mb-2">{title}</h1>
        <p className="text-lg text-center text-gray-300">{subtitle}</p>
        {breadcrumbs && (
          <nav className="mt-4 text-sm text-gray-400">  
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb.link ? (
                  <Link to={crumb.link} className="hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
              </span>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
