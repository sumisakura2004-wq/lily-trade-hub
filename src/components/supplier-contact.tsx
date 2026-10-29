import type { Dictionary } from "@/i18n";
import { companyContact, getVerifiedWhatsAppUrl } from "@/config/company-contact";

/** Keep the existing supplier contact guidance available during CMS outages. */
export function SupplierContact({ dictionary: d }: { dictionary: Dictionary }) {
  const whatsappUrl = getVerifiedWhatsAppUrl();

  return (
    <section className="contact-section section-anchor" id="contact" tabIndex={-1} aria-labelledby="contact-heading">
      <div className="container contact-inner">
        <div className="contact-copy">
          <p className="eyebrow">{d.contact.eyebrow}</p>
          <div className="contact-title-row"><h2 id="contact-heading">{d.contact.title}</h2><span className="status-badge">{d.common.comingSoon}</span></div>
          <p>{d.contact.invitation}</p>
          <p>{d.contact.preparation}</p>
          <dl className="contact-supplier">
            <dt>{d.contact.supplierLabel}</dt><dd>{d.contact.supplierName}</dd>
            <dt>{d.contact.emailLabel}</dt><dd><a className="contact-email-link" href={`mailto:${companyContact.email}`}>{companyContact.email}</a></dd>
            <dt>{d.contact.whatsappLabel}</dt><dd>{companyContact.whatsappName}</dd>
          </dl>
          {whatsappUrl
            ? <a className="contact-whatsapp-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer">{d.contact.whatsappAction}</a>
            : <p className="contact-whatsapp-unavailable">{d.contact.whatsappUnavailable}</p>}
        </div>
        <div className="quotation-preview contact-guidance">
          <h3>{d.contact.quotation}</h3>
          <p>{d.contact.status}</p>
        </div>
      </div>
    </section>
  );
}
