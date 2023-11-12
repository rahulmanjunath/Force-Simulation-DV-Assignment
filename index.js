const countries = [
    'Australia', 'Austria', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China',
    'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Finland', 'France',
    'Gabon', 'Germany', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq',
    'Ireland', 'Italy', 'Japan', 'Kazakhstan', 'Lebanon', 'Netherlands', 'Norway', 'Pakistan',
    'Philippines', 'Poland', 'Polytechnic Univ', 'Portugal', 'Qatar', 'Romania', 'Russian Federation',
    'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
    'Taiwan', 'Thailand', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'United Kingdom', 'United States'
];

d3.json("./data/publication_network.json").then(function (data) {
    // Create a color scale for countries without repetition
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(countries);
     // Set up the SVG container
     const margin = { top: 10, right: 10, bottom: 10, left: 10 };
     const width = window.innerWidth - margin.left - margin.right;
     const height = window.innerHeight - margin.top - margin.bottom;
 
     const svg = d3.select("body").append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
     // Create the force simulation
     const simulation = d3.forceSimulation(data.nodes)
       .force("link", d3.forceLink(data.links).id(d => d.id))
       .force("charge", d3.forceManyBody().strength(-1))
       .force("collide", d3.forceCollide(d => (d.num_citations / 1000)+5).iterations(2))
       .force("center", d3.forceCenter(width / 2, height / 2));
    

 
     // Create links
     const links = svg.selectAll("line")
       .data(data.links)
       .enter().append("line")
       .attr("stroke", "black");

    const node = svg.selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("r", d => (d.num_citations / 1000)+5)
        .attr("fill", d => colorScale(d.country))
        .on("click", handleNodeClick);

    // Add pan and zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // Zoom scale limits
        .on("zoom", zoomed);

    svg.call(zoom);

    // Update positions during simulation
    simulation.on("tick", () => {
        links
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
        node
          .attr("cx", d => Math.max(10, Math.min(width - 10, d.x)))
          .attr("cy", d => Math.max(10, Math.min(height - 10, d.y)));
  
    });

    function zoomed() {
        svg.attr("transform", d3.event.transform);
    }

    const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(20,20)"); // Adjust the translation based on your preference

    // Add color rectangles to the legend
    legend.selectAll("rect")
        .data(countries)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 10)
        .style("fill", colorScale);

    // Add text labels to the legend
    legend.selectAll("text")
        .data(countries)
        .enter().append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => d); // Adjust the color of the legend text


    // Function to show details on click
    function handleNodeClick(m,d) {
        // Check if a tooltip is already present
        const existingTooltip = d3.select(".tooltip");
        if (!existingTooltip.empty()) {
            existingTooltip.remove();
        }

        // Append a tooltip div
        const tooltip = d3.select(".container").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("padding", "10px")
            .style("margin", "10px")
            .style("background-color", "grey");

        // Set tooltip content
        tooltip.html(`Author: ${d.Name}<br>Country: ${d.country}<br>Publications: ${d.num_publications}<br>Citations: ${d.num_citations}`)
            .style("left", m.clientX + "px")
            .style("top", m.clientY + "px");

        // Show tooltip with a smooth transition
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);

        // Remove tooltip after a certain time (e.g., 3 seconds)
        setTimeout(() => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0)
                .remove();
        }, 3000);
    }


    function updateForces() {
        const linkStrength = parseFloat(document.getElementById("linkStrength").value);
        const collideForce = parseFloat(document.getElementById("collideForce").value);
        const chargeForce = parseFloat(document.getElementById("chargeForce").value);
        const nodeSize = document.querySelector('input[name="nodeSize"]:checked').value;

        // Update forces in the simulation
        simulation.force("link").strength(linkStrength);
        simulation.force("collide").strength(collideForce);
        simulation.force("charge").strength(chargeForce);

        // Update node size based on the selected option
        node.attr("r", d => getNodeSize(d, nodeSize));

        // Restart the simulation
        simulation.alpha(1).restart();
    }

    function getNodeSize(d, sizeMetric) {
        switch (sizeMetric) {
            case "publications":
                return (d.num_publications / 1000)+5;
            case "degree":
                if (d.degree > 100) {
                    return (d.degree / 100);
                }
                else if (d.degree > 10) {
                    return (d.degree / 10);
                }
                else
                    return (d.degree);
            case "citations":
                return (d.num_citations / 1000)+5;
            default:
                return 5; // Default size
        }
    }

    // Form submission listener
    document.getElementById("applyChanges").addEventListener("click", function (event) {
        updateForces();
    });
});
