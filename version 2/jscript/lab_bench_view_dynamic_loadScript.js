
var loadScript = function(scriptName) {
	initializeLoadScript(scriptName);

	if (scriptName == "Monte Carlo") {
		setNoteContents("This is a monte carlo note");
		setInstructionsContents("This is the monte carlo instruction");
		addRowToLoadParamsTable("Monte carlo saved parameter 1");
		setCaveats("This is a monte carlo caveat");
		addInputParameter("inputFile", "Input File", "Enter the input file", "input file tooltip", "input file warning", true);
		addInputParameter("numIterations", "Number of Iterations", "100", "num iterations tooltip", "num iterations warning", false);
		addFlag("verbosity", "Detailed Output", true, "verbosity tooltip", "verbosity warning");
	}
	
	if (scriptName == "Tophat-Cufflinks") {
		setNoteContents("tophat cufflinks notes");
		setInstructionsContents("inputFile has the format:\n"+
		"Name_For_Bam_Directory [tab] Fastq_File_Paths [tab] Replicate_Group [tab] read_size [tab] mean_fragmentSize\n"+
		"\nAn example input file is: /net/bmc-pub7/data2/boyerlab/public/Tools/RunTuxedo/sampleInput/sampleInput.txt\n"+
		"-> The first line is a title; records start from the second line onwards\n"+
		"-> For paired end files, enter the files in the Fastq_File_Paths column separated by xxx, eg: pairedEnd_1.fastqxxxpairedEnd_2.fastq\n"+
		"-> Replicate_Group is a name for each group of replicates; if there are no replicates, just put a unique name in each row\n"+
		"-> read_size is the size of each sequenced read (generally on the order of 40bp)\n"+
		"-> mean_fragmentSize is the mean size of the fragments whose ends are sequenced; I believe the BMC tends to produce 250bp fragments\n"+
		"NOTE: paths to fastq files in the input files should have the absolute path (full path); relative paths may not work correctly.\n")
		
		addRowToLoadParamsTable("tophat cufflinks saved parameter 1");
		setCaveats("paths to fastq files in the input files should have the absolute path (full path); relative paths may not work correctly.");
		addInputParameter("email", "Email", "avantis@mit.edu", "Email will be sent to this address on job completion", "", false);
		addInputParameter("genome", "Genome", "mm9_iGenomes", "The genome file used by bowtie to align", "Refers to genome builds in the biomicro's genomes directory", false);
		addInputParameter("gtfFile", "GTF file", "/net/bmc-pub7/data2/boyerlab/public/iGenomes/Mus_musculus/Ensembl/NCBIM37/Annotation/Genes/genes.gtf", "GTF documenting the genes; set to ENSEMBL by default", "If novel junctions is set to false, you will be limited to the junctions in this file", false);
		addInputParameter("genomeFastaFile", "Fasta file for genome", "/net/bmc-pub7/data2/boyerlab/public/iGenomes/Mus_musculus/Ensembl/NCBIM37/Sequence/WholeGenomeFasta/genome.fa", "The fasta file describing the genome", "Must be an absolute path", false);
		addFlag("novelJunctions", "Novel Junctions", false, "If checked, tophat will search for junctions ouside of the GTF file", "If checked, the resulting isoform names will no longer correspond directly to the names in the GTF file");
		addInputParameter("numOfProcessors", "Number of Processors", 4, "The number of processors used by tophat/cufflinks in their multicore processing", "DO NOT EXCEED 8. Recommended maximum of 6.", false);
		addInputParameter("inputFile", "Input File", "path/to/input/file", "Metadata containing the list of inputs for tophat/cufflinks; need not be absolute", "Please see instructions for the format of this file", true);
		addInputParameter("jobName", "Job Name", "", "Used to specify the names of the submission scripts. If not specified, defaults to file name of inputFile, minus the extension and the directory. So if the input file is /path/to/samples.txt, the jobName will default to \"samples\"", "", false);
		addInputParameter("outputDirectory", "Output Directory", "", "Defaults to currentDirectory/jobName, where currentDirectory is the directory the command was called from. The value of jobName can be specified by the user, otherwise the default will be used.", "", false);
	}
}

