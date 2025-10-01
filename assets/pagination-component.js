class PaginationComponent extends HTMLElement {
    constructor() {
        super();

    }

    get sectionId() {
        return this.dataset.sectionId;
    }

    connectedCallback() {

        this.links = this.querySelectorAll('a');
        this.links.forEach(link => {
            link.addEventListener('click', this.handleClick.bind(this));
        })
    }

    handleClick(event) {
        event.preventDefault();
        const url = new URL(event.currentTarget.href);
        url.searchParams.set('sections', this.sectionId);

        fetch(url.toString())
            .then(response => response.json())
            .then(data => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data[this.sectionId];
                document.querySelector('.product-grid-container').innerHTML += tempDiv.querySelector('.product-grid-container').innerHTML;
                // document.querySelector('.pagination-wrapper').innerHTML = tempDiv.querySelector('.pagination-wrapper').innerHTML;

                url.searchParams.delete('sections');

                window.history.pushState({}, '', url.toString());

                const currentPage = parseInt(url.searchParams.get('page'));

                if (currentPage >= parseInt(this.dataset.totalPages)) {
                    this.querySelector('.infinite-load-more').style.display = 'none';
                }

                url.searchParams.set('page', currentPage + 1);

                this.querySelector('.infinite-load-more a').setAttribute('href', url.toString());
            })
            .catch(error => console.error('Error fetching pagination data:', error));

    }
}

customElements.define('pagination-component', PaginationComponent);