import random
from django.shortcuts import render, redirect
import markdown2
from . import util

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry(request, title):
    markdown_content = util.get_entry(title)
    if markdown_content is None:
        return render(request, "encyclopedia/error.html", {
            "message": "The requested page was not found."
        })
    html_content = markdown2.markdown(markdown_content)
    return render(request, "encyclopedia/entry.html", {
        "title": title,
        "content": html_content
    })

def search(request):
    query = request.GET.get('q', '').strip()
    if not query:
        return redirect("index")
    if util.get_entry(query) is not None:
        return redirect("entry", title=query)
    all_entries = util.list_entries()
    results = [entry for entry in all_entries if query.lower() in entry.lower()]
    return render(request, "encyclopedia/search.html", {"results": results, "query": query})

def new_page(request):
    if request.method == "POST":
        title = request.POST.get("title").strip()
        content = request.POST.get("content")
        if not title or not content:
            return render(request, "encyclopedia/new_page.html", {"error": "All fields are required."})
        if util.get_entry(title) is not None:
            return render(request, "encyclopedia/new_page.html", {
                "error": "An entry with this title already exists!", "title": title, "content": content
            })
        util.save_entry(title, content)
        return redirect("entry", title=title)
    return render(request, "encyclopedia/new_page.html")

def edit_page(request, title):
    if request.method == "POST":
        content = request.POST.get("content")
        util.save_entry(title, content)
        return redirect("entry", title=title)
    content = util.get_entry(title)
    return render(request, "encyclopedia/edit_page.html", {"title": title, "content": content})

def random_page(request):
    entries = util.list_entries()
    if entries:
        return redirect("entry", title=random.choice(entries))
    return redirect("index")