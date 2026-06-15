export function generateStaticParams() {
  console.log("BUILD TRACE: generateStaticParams in src/app/[subdomain]/layout.tsx");
  return [{ subdomain: 'demo' }];
}

export default function SubdomainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("BUILD TRACE: SubdomainLayout rendered");
  return <>{children}</>;
}
