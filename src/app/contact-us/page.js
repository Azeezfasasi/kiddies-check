import ContactUsMain from "@/components/home-component/ContactUsMain";
import PageTitle from "@/components/home-component/PageTitle";

export const metadata = {
  title: 'Contact Us - KiddiesCheck',
  description: 'Get in touch with KiddiesCheck to learn more about our child safety solutions or to discuss how we can help your community.',
  openGraph: {
    title: 'Contact Us - KiddiesCheck',
    description: 'Have questions or want to work with us? Reach out using the form below or through our contact details.',
    url: 'https://kiddiescheck.org/contact-us',
    type: 'website',
  },
};

export default function ContactUs() {
  return (
    <>
    <PageTitle title="Contact Us" subtitle="Have questions or want to work with us? Reach out using the form below or through our contact details." />
    <ContactUsMain />
    </>
  )
}
