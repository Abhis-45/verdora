import Layout from "../../components/common/layout";
import servicesData from "../../data/services.json";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import Link from "next/link";

interface Package {
  id: string;
  name: string;
  desc: string;
}

interface Service {
  slug: string;
  title: string;
  desc: string;
  details: string;
  image: string;
  packages: Package[];
}

export async function getStaticPaths() {
  const paths = servicesData.map((s: Service) => ({
    params: { slug: s.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const service = servicesData.find((s: Service) => s.slug === params.slug);
  return { props: { service } };
}

export default function ServiceDetail({ service }: { service: Service }) {
  return (
    <>
      <Head>
        <title>{service.title} | Verdora</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/services"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-4">
            {service.title}
          </h1>
          <p className="text-gray-700 mb-6">{service.details}</p>

          <h2 className="text-lg font-semibold text-green-700 mb-3">
            Packages
          </h2>
          <div className="space-y-4">
            {service.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-md p-4 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-md font-bold text-gray-900">{pkg.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{pkg.desc}</p>
                <p className="text-xs text-gray-500 italic">
                  Pricing depends on quality and quantity — contact us for a
                  quote.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
}
