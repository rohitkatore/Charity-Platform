import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ROUTE_PATHS } from "../../app/routes";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function CharityProfilePage() {
  const { charityId } = useParams();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .getCharityProfile(charityId)
      .then((result) => {
        if (active) {
          setCharity(result.charity);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [charityId]);

  async function handleIndependentDonation(event) {
    event.preventDefault();
    setDonationMessage("");
    try {
      const result = await apiClient.createIndependentDonation(charityId, {
        donorEmail: donorEmail || null,
        amount: Number(amount),
      });
      setDonationMessage(result.note || "Independent donation intent recorded.");
      setAmount("");
    } catch (err) {
      setDonationMessage(err.message);
    }
  }

  if (loading) {
    return <section className="space-y-4 text-sm text-slate-300">Loading charity profile...</section>;
  }

  if (error || !charity) {
    return <section className="space-y-4 text-sm text-red-300">{error || "Charity profile not found"}</section>;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Charity"
        title={charity.name}
        description="Charity profile includes description, images, and upcoming events as defined by the PRD."
      />

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card title="Description">
          <p className="text-sm text-slate-300">{charity.description}</p>
        </Card>

        <Card title="Image Gallery">
          <div className="grid grid-cols-2 gap-2" aria-label="Charity images">
            {charity.images.length === 0 ? (
              <p className="col-span-2 text-sm text-slate-300">No images have been uploaded for this charity yet.</p>
            ) : (
              charity.images.map((imageRef, idx) => {
                const isUrl = String(imageRef).startsWith("http");
                return isUrl ? (
                  <img
                    key={imageRef}
                    src={imageRef}
                    alt={`${charity.name} image ${idx + 1}`}
                    className="h-32 w-full rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div
                    key={imageRef}
                    className="flex h-32 flex-col items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-surface-300 to-surface-200 p-3"
                  >
                    <svg className="mb-2 h-8 w-8 text-brand-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <p className="text-xs text-slate-400">Charity Image {idx + 1}</p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card title="Upcoming Events">
        {charity.upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-300">Placeholder: no upcoming events configured.</p>
        ) : (
          <ul className="space-y-3 text-sm text-slate-300">
            {charity.upcomingEvents.map((eventTitle) => (
              <li key={eventTitle} className="rounded-xl border border-white/10 p-3">
                {eventTitle}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Independent Donation Option">
        <form className="space-y-3" onSubmit={handleIndependentDonation} noValidate>
          <label className="block text-sm text-slate-200" htmlFor="donor-email">
            Donor Email (optional)
            <input
              id="donor-email"
              type="email"
              value={donorEmail}
              onChange={(event) => setDonorEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200" htmlFor="donation-amount">
            Donation Amount
            <input
              id="donation-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>

          <Button type="submit">Record Independent Donation</Button>
          {donationMessage ? <p className="text-sm text-slate-300">{donationMessage}</p> : null}
        </form>
      </Card>

      <div className="rounded-2xl border border-brand-500/40 bg-brand-600/10 p-5">
        <h2 className="text-lg font-semibold text-slate-50">Support Through Subscription</h2>
        <p className="mt-2 text-sm text-slate-200">
          Continue to subscription to select your charity during signup and set your contribution percentage.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={ROUTE_PATHS.public.subscribe}>
            <Button>Subscribe Now</Button>
          </Link>
          <Link to={ROUTE_PATHS.public.charities}>
            <Button variant="secondary">Back to Charity Directory</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}