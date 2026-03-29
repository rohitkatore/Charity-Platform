import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { apiClient } from "../../lib/apiClient";

export function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const result = await apiClient.getAdminCharities();
    setCharities(result.charities || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function resetForm() {
    setEditingId("");
    setName("");
    setDescription("");
    setImages("");
    setUpcomingEvents("");
    setIsFeatured(false);
  }

  function startEdit(charity) {
    setEditingId(charity.id);
    setName(charity.name);
    setDescription(charity.description);
    setImages((charity.images || []).join(", "));
    setUpcomingEvents((charity.upcomingEvents || []).join(", "));
    setIsFeatured(Boolean(charity.isFeatured));
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        name,
        description,
        images: images.split(",").map((item) => item.trim()).filter(Boolean),
        upcomingEvents: upcomingEvents.split(",").map((item) => item.trim()).filter(Boolean),
        isFeatured,
      };

      if (editingId) {
        await apiClient.updateAdminCharity(editingId, payload);
      } else {
        await apiClient.createAdminCharity(payload);
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(charityId) {
    try {
      setError("");
      await apiClient.deleteAdminCharity(charityId);
      if (editingId === charityId) {
        resetForm();
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Charity Management"
        description="Add, edit, delete charities and manage content and media fields."
      />

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <Card title={editingId ? "Edit Charity" : "Add Charity"}>
        <form onSubmit={save} className="grid gap-4" noValidate>
          <label className="text-sm text-slate-200" htmlFor="admin-charity-name">
            Name
            <input
              id="admin-charity-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-200" htmlFor="admin-charity-description">
            Description
            <textarea
              id="admin-charity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-200" htmlFor="admin-charity-images">
              Images (comma separated)
              <input
                id="admin-charity-images"
                value={images}
                onChange={(event) => setImages(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
            <label className="text-sm text-slate-200" htmlFor="admin-charity-events">
              Upcoming Events (comma separated)
              <input
                id="admin-charity-events"
                value={upcomingEvents}
                onChange={(event) => setUpcomingEvents(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-surface-300 px-3 py-2 text-slate-100"
              />
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
            Featured charity
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{editingId ? "Update Charity" : "Create Charity"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel Edit</Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Charities">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Featured</th>
                <th className="px-3 py-2">Images</th>
                <th className="px-3 py-2">Events</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.map((charity) => (
                <tr key={charity.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{charity.name}</td>
                  <td className="px-3 py-2">{charity.isFeatured ? "yes" : "no"}</td>
                  <td className="px-3 py-2">{(charity.images || []).length}</td>
                  <td className="px-3 py-2">{(charity.upcomingEvents || []).length}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" onClick={() => startEdit(charity)}>Edit</Button>
                      <Button type="button" variant="secondary" onClick={() => remove(charity.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {charities.length === 0 ? (
                <tr>
                  <td className="px-3 py-3" colSpan={5}>No charities available.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}