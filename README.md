# gitbook-plugin-sequence

[![NPM](https://nodei.co/npm/gitbook-plugin-sequence.png)](https://nodei.co/npm/gitbook-plugin-sequence/)

[js-sequence-diagrams](https://github.com/bramp/js-sequence-diagrams) plugin for [GitBook](https://github.com/GitbookIO/gitbook)

## Installation

    $ npm install gitbook-plugin-sequence

book.json add the plugin

```
{
  "plugins": ["sequence"]
}
```

## Features

* Support HTML, PDF, EPUB output(make sure your gitbook support SVG)
* Support ```flow code block quote
* Multi code style support

## Configuration

book.json add the js-sequence-diagrams options

```
"pluginsConfig": {
  "sequence-diagrams": {
    "theme": "simple"
  }
}
```

## Usage


To include a sequence diagram, just wrap your definition in a "sequence" code block. For example:

<pre lang="no-highlight"><code>```sequence
    Title: Here is a title
    A->B: Normal line
    B-->C: Dashed line
    C->>D: Open arrow
    D-->>A: Dashed open arrow
```
</code></pre>

Also you can put in your book block as

```
{% sequence %}
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
{% endsequence %}
```

### Extend the width

```
{% sequence width=770 %}
```
