export default function PageTitle({ title, subtitle, breadcrumbs }) {
  return (
    <section className="bg-gray-300 py-16">
      <div className="container mx-auto px-6 lg:px-20 text-center">
        {/* Breadcrumbs */}
        {breadcrumbs && (
          <nav className="text-gray-500 text-sm mb-2" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index !== 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-gray-800 transition">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-800 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{title}</h1>

        {/* Optional Subtitle */}
        {subtitle && <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  );
}
